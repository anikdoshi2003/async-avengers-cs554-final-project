import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Event from "@/models/Event";
import RSVP from "@/models/RSVP";
import { verifyToken } from "@/firebase/verifyToken";

export async function POST(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing authentication token" },
        { status: 401 }
      );
    }

    if (!status || !["going", "not_going"].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "going" or "not_going"' },
        { status: 400 }
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

    const normalizedUserPincode = userPincode.replace(/-/g, "").slice(0, 5);

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const normalizedEventPincode = event.pincode.replace(/-/g, "").slice(0, 5);
    if (normalizedEventPincode !== normalizedUserPincode) {
      return NextResponse.json(
        { error: "You can only RSVP to events in your pincode area" },
        { status: 403 }
      );
    }

    const rsvp = await RSVP.findOneAndUpdate(
      { event: event._id, user: user._id },
      { status: status },
      { new: true, upsert: true, runValidators: true }
    ).populate("user", "firebaseUid firstName lastName photoURL");

    return NextResponse.json({
      success: true,
      rsvp: {
        _id: rsvp._id,
        event: rsvp.event,
        user: {
          _id: rsvp.user._id,
          firebaseUid: rsvp.user.firebaseUid,
          name: `${rsvp.user.firstName} ${rsvp.user.lastName}`,
          photoURL: rsvp.user.photoURL,
        },
        status: rsvp.status,
        createdAt: rsvp.createdAt,
        updatedAt: rsvp.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating/updating RSVP:", error);
    return NextResponse.json(
      { error: "Failed to create/update RSVP" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

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

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await RSVP.findOneAndDelete({ event: event._id, user: user._id });

    return NextResponse.json({
      success: true,
      message: "RSVP removed successfully",
    });
  } catch (error) {
    console.error("Error removing RSVP:", error);
    return NextResponse.json(
      { error: "Failed to remove RSVP" },
      { status: 500 }
    );
  }
}
