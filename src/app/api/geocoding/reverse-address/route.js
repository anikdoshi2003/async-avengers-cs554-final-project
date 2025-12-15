import { NextResponse } from "next/server";
import { coordsToAddressAuto } from "@/lib/geocoding.js";
import { isRabbitMQAvailable } from "@/lib/rabbitmq.js";
import {
  publishGeocodingJob,
  getGeocodingResult,
} from "@/lib/geocodingQueue.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const useQueue = searchParams.get("queue") !== "false";

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude parameters are required" },
        { status: 400 }
      );
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude format" },
        { status: 400 }
      );
    }

    if (latNum < -90 || latNum > 90) {
      return NextResponse.json(
        { error: "Latitude must be between -90 and 90" },
        { status: 400 }
      );
    }

    if (lngNum < -180 || lngNum > 180) {
      return NextResponse.json(
        { error: "Longitude must be between -180 and 180" },
        { status: 400 }
      );
    }

    if (useQueue) {
      try {
        const rabbitmqAvailable = await isRabbitMQAvailable();

        if (rabbitmqAvailable) {
          const job = await publishGeocodingJob(
            null,
            "reverse-address",
            {},
            latNum,
            lngNum
          );

          if (job.cached && job.status === "completed") {
            const cachedResult = await getGeocodingResult(job.jobId);
            if (cachedResult && cachedResult.result) {
              return NextResponse.json({
                success: true,
                address: cachedResult.result,
                cached: true,
                lat: latNum,
                lng: lngNum,
              });
            }
          }

          if (job.jobId && job.status === "queued") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const statusResult = await getGeocodingResult(job.jobId);

            if (
              statusResult &&
              (statusResult.status === "queued" ||
                statusResult.status === "processing")
            ) {
              console.warn(
                `[API] ⚠️  Worker appears unavailable (job still ${statusResult.status} after 1s), falling back to direct geocoding - Lat: ${latNum}, Lng: ${lngNum}`
              );
            } else if (
              statusResult &&
              statusResult.status === "completed" &&
              statusResult.result
            ) {
              return NextResponse.json({
                success: true,
                address: statusResult.result,
                lat: latNum,
                lng: lngNum,
              });
            } else if (statusResult && statusResult.status === "failed") {
              console.warn(
                `[API] ⚠️  Worker job failed, falling back to direct geocoding - Lat: ${latNum}, Lng: ${lngNum}`
              );
            }
          } else if (job.jobId && job.status === "completed") {
            const result = await getGeocodingResult(job.jobId);
            if (result && result.result) {
              return NextResponse.json({
                success: true,
                address: result.result,
                lat: latNum,
                lng: lngNum,
              });
            }
          }
        }
      } catch (queueError) {
        console.warn(
          `[API] ⚠️  RabbitMQ unavailable or failed, falling back to direct reverse geocoding - Lat: ${latNum}, Lng: ${lngNum}`,
          queueError.message
        );
      }
    }

    console.log(
      `[API] 🔄 Using direct reverse geocoding (no RabbitMQ) - Lat: ${latNum}, Lng: ${lngNum}`
    );
    const address = await coordsToAddressAuto(latNum, lngNum);

    if (!address) {
      return NextResponse.json(
        { error: "Address not found for these coordinates" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      address: address,
      lat: latNum,
      lng: lngNum,
    });
  } catch (error) {
    console.error("Error getting address from coordinates:", error);
    return NextResponse.json(
      {
        error: "Failed to get address from coordinates",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
