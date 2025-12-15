import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Event from "@/models/Event";
import { sanitizeText } from "@/lib/sanitizeInput";
import { verifyToken } from "@/firebase/verifyToken";
import { reverseGeocodeWithQueue } from "@/lib/reverseGeocodingHelper";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { title, description, eventDate, location, uid } = body;

    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing authentication token" },
        { status: 401 }
      );
    }

    const userId = uid || decodedToken.uid;

    if (uid && decodedToken.uid !== uid) {
      return NextResponse.json(
        { error: "Forbidden: You can only create events for your own account" },
        { status: 403 }
      );
    }

    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.moderation?.banned === true) {
      return NextResponse.json({ error: "Account is banned" }, { status: 403 });
    }

    const userPincode = user.profile?.pincode;
    if (!userPincode) {
      return NextResponse.json(
        {
          error:
            "Pincode is required. Please set your pincode in your profile.",
        },
        { status: 400 }
      );
    }

    if (
      !location ||
      typeof location.lat !== "number" ||
      typeof location.lng !== "number"
    ) {
      return NextResponse.json(
        { error: "Valid location with lat and lng is required" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    if (!eventDate) {
      return NextResponse.json(
        { error: "Event date is required" },
        { status: 400 }
      );
    }

    if (
      location.lat < -90 ||
      location.lat > 90 ||
      location.lng < -180 ||
      location.lng > 180
    ) {
      return NextResponse.json(
        { error: "Invalid location coordinates" },
        { status: 400 }
      );
    }

    const eventDateObj = new Date(eventDate);
    if (isNaN(eventDateObj.getTime())) {
      return NextResponse.json(
        { error: "Invalid event date" },
        { status: 400 }
      );
    }

    if (eventDateObj <= new Date()) {
      return NextResponse.json(
        { error: "Event date must be in the future" },
        { status: 400 }
      );
    }

    let locationPincode;
    try {
      locationPincode = await reverseGeocodeWithQueue(
        location.lat,
        location.lng,
        30
      );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error.message ||
            "Could not determine pincode for selected location. Please select a valid location.",
        },
        { status: 400 }
      );
    }

    const normalizedUserPincode = userPincode.replace(/-/g, "").slice(0, 5);
    const normalizedLocationPincode = locationPincode
      .replace(/-/g, "")
      .slice(0, 5);

    if (normalizedUserPincode !== normalizedLocationPincode) {
      return NextResponse.json(
        {
          error: `Selected location is not within your pincode (${userPincode}). You can only create events in your pincode area.`,
        },
        { status: 400 }
      );
    }

    const sanitizedTitle = sanitizeText(title.trim());
    const sanitizedDescription = sanitizeText(description.trim());

    if (sanitizedTitle.length === 0 || sanitizedDescription.length === 0) {
      return NextResponse.json(
        { error: "Title and description cannot be empty after sanitization" },
        { status: 400 }
      );
    }

    if (sanitizedTitle.length < 3 || sanitizedTitle.length > 200) {
      return NextResponse.json(
        { error: "Title must be between 3 and 200 characters" },
        { status: 400 }
      );
    }

    if (
      sanitizedDescription.length < 10 ||
      sanitizedDescription.length > 2000
    ) {
      return NextResponse.json(
        { error: "Description must be between 10 and 2000 characters" },
        { status: 400 }
      );
    }

    const event = await Event.create({
      createdBy: user._id,
      title: sanitizedTitle,
      description: sanitizedDescription,
      eventDate: eventDateObj,
      location: {
        lat: location.lat,
        lng: location.lng,
      },
      pincode: normalizedUserPincode,
    });

    await event.populate(
      "createdBy",
      "firebaseUid firstName lastName photoURL"
    );

    return NextResponse.json({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        description: event.description,
        eventDate: event.eventDate,
        location: event.location,
        pincode: event.pincode,
        createdBy: {
          _id: event.createdBy._id,
          firebaseUid: event.createdBy.firebaseUid,
          name: event.createdBy.name,
          photoURL: event.createdBy.photoURL,
        },
        createdAt: event.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing authentication token" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userPincode = user.profile?.pincode;
    if (!userPincode) {
      return NextResponse.json(
        {
          error:
            "Pincode is required. Please set your pincode in your profile.",
        },
        { status: 400 }
      );
    }

    const normalizedPincode = userPincode.replace(/-/g, "").slice(0, 5);

    const { searchParams } = new URL(request.url);
    const includePast = searchParams.get("includePast") === "true";
    const limit = parseInt(searchParams.get("limit")) || 100;

    const query = {
      pincode: normalizedPincode,
    };

    if (!includePast) {
      query.eventDate = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .populate("createdBy", "firebaseUid firstName lastName photoURL")
      .sort({ eventDate: 1 }) // Sort by event date ascending (upcoming first)
      .limit(limit)
      .lean();

    const formattedEvents = events.map((event) => ({
      _id: event._id,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      location: event.location,
      pincode: event.pincode,
      createdBy: {
        _id: event.createdBy._id,
        firebaseUid: event.createdBy.firebaseUid,
        name: `${event.createdBy.firstName} ${event.createdBy.lastName}`,
        photoURL: event.createdBy.photoURL,
      },
      createdAt: event.createdAt,
    }));

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      count: formattedEvents.length,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events", events: [] },
      { status: 500 }
    );
  }
}
