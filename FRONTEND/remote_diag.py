
import subprocess
import time
import sys

def run_ssh_cmd(host, password, cmd):
    ssh_cmd = f'ssh -tt -o StrictHostKeyChecking=no root@{host} "{cmd}"'
    print(f'Running: {ssh_cmd}')
    
    process = subprocess.Popen(
        ssh_cmd,
        shell=True,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for the password prompt
    time.sleep(2)
    process.stdin.write(password + '\n')
    process.stdin.flush()
    
    stdout, stderr = process.communicate()
    return stdout, stderr

if __name__ == "__main__":
    host = "212.227.134.161"
    password = "Wzs8sX4y9c1TBJp"
    
    # Command to run
    cmd = "df -h && free -m && systemctl status mariadb --no-pager && mysql -e 'SHOW TABLES IN qapg033' && journalctl -u plesk-task-manager -n 20 --no-pager"
    
    stdout, stderr = run_ssh_cmd(host, password, cmd)
    print("STDOUT:")
    print(stdout)
    print("STDERR:")
    print(stderr)
