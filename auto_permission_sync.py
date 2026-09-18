#!/usr/bin/env python3
import time
import json
import urllib.request
import base64

AUTH = base64.b64encode(b'admin:admin').decode()

def sync_permissions():
    try:
        req = urllib.request.Request(
            'http://127.0.0.1:8082/api/devices?all=true',
            headers={'Authorization': f'Basic {AUTH}'}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            devices = json.loads(resp.read().decode())
        
        req_user = urllib.request.Request(
            'http://127.0.0.1:8082/api/devices',
            headers={'Authorization': f'Basic {AUTH}'}
        )
        with urllib.request.urlopen(req_user, timeout=5) as resp:
            user_devices = json.loads(resp.read().decode())
        user_dev_ids = {d['id'] for d in user_devices}

        for dev in devices:
            dev_id = dev['id']
            if dev_id not in user_dev_ids:
                perm_data = json.dumps({'userId': 1, 'deviceId': dev_id}).encode()
                perm_req = urllib.request.Request(
                    'http://127.0.0.1:8082/api/permissions',
                    data=perm_data,
                    headers={'Authorization': f'Basic {AUTH}', 'Content-Type': 'application/json'}
                )
                try:
                    with urllib.request.urlopen(perm_req, timeout=5) as p_resp:
                        print(f"Auto-linked device {dev_id} ({dev.get('name')}) to user 1: {p_resp.status}", flush=True)
                except Exception as ex:
                    pass
    except Exception as e:
        pass

def main():
    print("Auto permission sync worker started...", flush=True)
    while True:
        sync_permissions()
        time.sleep(2)

if __name__ == '__main__':
    main()
