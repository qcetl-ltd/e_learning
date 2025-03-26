import smtplib
from email.mime.text import MIMEText

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465
SMTP_USER = "danushkaaberathna0@gmail.com"
SMTP_PASSWORD = "cmcwiumeltescfcu"  
EMAIL_FROM = "danushkaaberathna0@gmail.com"
EMAIL_TO = "skolla353@gmail.com"

msg = MIMEText("This is a test email from FastAPI.")
msg["Subject"] = "SMTP Test"
msg["From"] = EMAIL_FROM
msg["To"] = EMAIL_TO

try:
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()
    server.login(SMTP_USER, SMTP_PASSWORD)
    server.sendmail(EMAIL_FROM, EMAIL_TO, msg.as_string())
    server.quit()
    print("✅ Email sent successfully!")
except Exception as e:
    print(f"❌ Error sending email: {e}")
