"""
Verify Twilio credentials without sending SMS (default).

Usage (from saferoute-backend/):
    python scripts/verify_twilio.py

Optional real test (sends one SMS):
    set TWILIO_SEND_TEST=1
    set TWILIO_TEST_TO=+639XXXXXXXXX
    python scripts/verify_twilio.py
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")


def main() -> int:
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_num = os.getenv("TWILIO_PHONE_NUMBER")

    if not all([sid, token, from_num]):
        print("Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER in .env")
        return 1

    try:
        from twilio.rest import Client

        client = Client(sid, token)
        client.incoming_phone_numbers.list(limit=1)
        print("OK: Twilio credentials accepted (incoming numbers list succeeded)")
    except Exception as e:
        print(f"ERROR: Twilio API check failed: {e}")
        return 1

    if os.getenv("TWILIO_SEND_TEST") == "1":
        to = os.getenv("TWILIO_TEST_TO")
        if not to:
            print("TWILIO_SEND_TEST=1 requires TWILIO_TEST_TO (+E.164 number)")
            return 1
        from twilio.rest import Client

        client = Client(sid, token)
        msg = client.messages.create(
            body="SafeRoute: Twilio test message.",
            from_=from_num,
            to=to,
        )
        print(f"OK: Test SMS sent, sid={msg.sid}")
    else:
        print("Dry-run only (no SMS). Set TWILIO_SEND_TEST=1 and TWILIO_TEST_TO to send one test.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
