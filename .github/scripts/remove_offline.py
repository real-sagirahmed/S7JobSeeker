import os
from ftplib import FTP_TLS

def main():
    server = os.environ.get("FTP_SERVER", "")
    user = os.environ.get("FTP_USER", "")
    passwd = os.environ.get("FTP_PASS", "")

    if not server or not user or not passwd:
        print("Notice: FTP credentials not fully configured in environment.")
        return

    try:
        ftps = FTP_TLS(server)
        ftps.login(user, passwd)
        ftps.prot_p()

        target_files = ["wwwroot/app_offline.htm", "app_offline.htm"]
        for path in target_files:
            try:
                ftps.delete(path)
                print(f"Successfully removed {path}")
            except Exception as e:
                print(f"Notice: {path} - {e}")

        ftps.quit()
        print("IIS app_offline removal complete. Application is online.")
    except Exception as err:
        print(f"FTP online cleanup error: {err}")

if __name__ == "__main__":
    main()
