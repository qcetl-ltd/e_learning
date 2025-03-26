import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = "danushkaaberathna0@gmail.com"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        # Use SSL and port 465
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login("danushkaaberathna0@gmail.com", "cmcwiumeltescfcu")
            server.sendmail("danushkaaberathna0@gmail.com", to_email, msg.as_string())

        print("Email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {e}")
