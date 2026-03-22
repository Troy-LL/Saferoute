from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")


def send_buddy_alert(user_name, current_location, destination, buddy_phone, tracking_url):
    """
    Send emergency SMS to buddy
    
    Args:
        user_name: Name of user
        current_location: Dict with 'lat', 'lng', 'address'
        destination: Destination address
        buddy_phone: Phone number to send to (format: +639XXXXXXXXX)
        tracking_url: URL for live tracking
    
    Returns:
        Twilio message SID
    """
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        raise Exception("Twilio credentials not fully configured in .env")

    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    message_body = f"""SafeRoute Alert: {user_name} is walking from {current_location['address']} to {destination}.

Current location: ({current_location['lat']:.6f}, {current_location['lng']:.6f})
Track: {tracking_url}

This is an automated message from SafeRoute."""

    message = client.messages.create(
        body=message_body,
        from_=TWILIO_PHONE_NUMBER,
        to=buddy_phone
    )

    return message.sid


# Test function
if __name__ == "__main__":
    try:
        sid = send_buddy_alert(
            user_name="Test User",
            current_location={
                'lat': 14.6507,
                'lng': 121.1029,
                'address': "UP Diliman, Quezon City"
            },
            destination="Quezon Memorial Circle",
            buddy_phone="+639XXXXXXXXX",  # Replace with real test number
            tracking_url="https://saferoute.vercel.app/track/test123"
        )
        print(f"SMS sent! SID: {sid}")
    except Exception as e:
        print(f"Error: {e}")
