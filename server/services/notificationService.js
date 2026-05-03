import webpush from "web-push";
import NotificationSubscription from "../models/notificationSubscriptionModel.js";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:example@domain.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const subscribeToNotifications = async (clinicId, subscription, ticketId) => {
  try {
    const newSubscription = new NotificationSubscription({
      clinicId,
      ticketId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    });

    await newSubscription.save();
    return newSubscription;
  } catch (error) {
    console.error("Error saving notification subscription:", error);
    throw error;
  }
};

export const notifyTicketCalled = async (ticketId, clinicId, ticketData) => {
  try {
    const subscriptions = await NotificationSubscription.find({
      clinicId,
      ticketId,
    });

    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title: "Your ticket has been called!",
      body: `Ticket ${ticketData.number} - Please proceed to the counter`,
      tag: `ticket-${ticketId}`,
      data: {
        ticketId,
        ticketNumber: ticketData.number,
        queueId: ticketData.queueId,
      },
    });

    const promises = subscriptions.map((sub) =>
      webpush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload
        )
        .catch((err) => {
          // If subscription is invalid, delete it
          if (err.statusCode === 410) {
            NotificationSubscription.deleteOne({ _id: sub._id }).catch(
              console.error
            );
          }
          console.error("Error sending notification:", err);
        })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error("Error notifying ticket called:", error);
  }
};
