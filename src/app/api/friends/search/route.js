import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import FriendRequest from "@/models/FriendRequest";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const userId = request.headers.get("user-id");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }

    let currentUser = null;
    let friendIds = [];

    if (userId) {
      currentUser = await User.findOne({ firebaseUid: userId });
      if (currentUser) {
        friendIds = currentUser.friends.map((id) => id.toString());
      }
    }

    const foundUsers = await User.find({
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
      ...(userId && { firebaseUid: { $ne: userId } }),
      softDeleted: false,
    })
      .limit(20)
      .select("_id firebaseUid firstName lastName email photoURL profile")
      .lean();

    let pendingRequests = [];
    if (currentUser) {
      pendingRequests = await FriendRequest.find({
        $or: [
          { fromUser: currentUser._id, status: "pending" },
          { toUser: currentUser._id, status: "pending" },
        ],
      }).lean();
    }

    const sentRequestToUsers = new Set(
      pendingRequests
        .filter(
          (req) => req.fromUser.toString() === currentUser?._id.toString()
        )
        .map((req) => req.toUser.toString())
    );

    const receivedRequestFromUsers = new Set(
      pendingRequests
        .filter((req) => req.toUser.toString() === currentUser?._id.toString())
        .map((req) => req.fromUser.toString())
    );

    const users = foundUsers.map((user) => {
      const userIdStr = user._id.toString();
      const isAlreadyFriend = friendIds.includes(userIdStr);
      const requestSent = sentRequestToUsers.has(userIdStr);
      const requestReceived = receivedRequestFromUsers.has(userIdStr);

      return {
        _id: user._id,
        id: user.firebaseUid,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        photoURL: user.photoURL,
        avatar:
          user.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.firstName + " " + user.lastName
          )}&background=0D8ABC&color=fff`,
        isAlreadyFriend: isAlreadyFriend,
        requestSent: requestSent,
        requestReceived: requestReceived,
        city: user.profile?.city || null,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users", users: [] },
      { status: 500 }
    );
  }
}
