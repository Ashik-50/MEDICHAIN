import smtplib
from email.message import EmailMessage
import ssl
import os

def send_email(to_email: str, subject: str, body: str):

    EMAIL_ADDRESS = ""
    EMAIL_PASSWORD = ""

    msg = EmailMessage()
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    context = ssl.create_default_context()

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls(context=context)
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
        print("Email sent successfully")

    except Exception as e:
        print("Email sending failed:", str(e))