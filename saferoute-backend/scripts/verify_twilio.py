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
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env", override=True)


def _clean(val: str | None) -> str | None:
    if val is None:
        return None
    s = val.strip().lstrip("\ufeff")  # UTF-8 BOM if .env saved from some editors
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip()
    return s


def main() -> int:
    sid = _clean(os.getenv("TWILIO_ACCOUNT_SID"))
    token = _clean(os.getenv("TWILIO_AUTH_TOKEN"))
    from_num = _clean(os.getenv("TWILIO_PHONE_NUMBER"))

    if not all([sid, token, from_num]):
        print("Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER in saferoute-backend/.env")
        return 1

    if sid.startswith("SK"):
        print(
            "ERROR: TWILIO_ACCOUNT_SID looks like an API Key SID (starts with SK).\n"
            "Use your Account SID from the Twilio Console home page (starts with AC) with the Auth Token,\n"
            "or use API Key auth: Client(api_key, api_key_secret, account_sid=your_AC_sid)."
        )
        return 1

    if not sid.startswith("AC"):
        print(
            "ERROR: TWILIO_ACCOUNT_SID must start with AC (Account SID on Twilio Console home page)."
        )
        return 1
    if len(sid) != 34:
        print(
            f"ERROR: TWILIO_ACCOUNT_SID should be 34 characters; got {len(sid)}. "
            "Check for typos, spaces, or missing characters in .env."
        )
        return 1

    if not re.match(r"^\+[1-9]\d{6,14}$", from_num):
        print(
            "WARNING: TWILIO_PHONE_NUMBER should be E.164 (e.g. +14155552671). "
            f"Got: {from_num!r}"
        )

    try:
        from twilio.rest import Client

        client = Client(sid, token)
        client.incoming_phone_numbers.list(limit=1)
        print("OK: Twilio credentials accepted (incoming numbers list succeeded)")
    except Exception as e:
        print(f"ERROR: Twilio API check failed: {e}")
        print(
            "Check: Account SID = AC... (Console), Auth Token matches that account, no extra spaces/quotes in .env."
        )
        return 1

    if os.getenv("TWILIO_SEND_TEST") == "1":
        to = _clean(os.getenv("TWILIO_TEST_TO"))
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
