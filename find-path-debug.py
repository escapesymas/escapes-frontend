
import ftplib
import os

FTP_HOST = '212.227.134.161'
FTP_USER = 'backendescapes.com_css4v'
FTP_PASS = 't78!wBDuK7'

def find_plugins_dir():
    try:
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.set_pasv(True)
        
        print("Logged in. Listing root...")
        root_files = ftp.nlst()
        print("Root:", root_files)
        
        # Common paths to check
        paths_to_check = [
            'html/wp-content/plugins',
            'public_html/wp-content/plugins',
            'httpdocs/wp-content/plugins',
            'wp-content/plugins'
        ]
        
        for path in paths_to_check:
            try:
                ftp.cwd(path)
                print(f"✅ Found plugins dir at: {path}")
                ftp.quit()
                return path
            except:
                continue
        
        print("❌ Could not find plugins dir automatically.")
        ftp.quit()
    except Exception as e:
        print(f"❌ FTP Error: {e}")

if __name__ == "__main__":
    find_plugins_dir()
