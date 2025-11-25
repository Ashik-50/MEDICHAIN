import os
import requests

IPFS_API = os.getenv("IPFS_API", "http://127.0.0.1:5001")

def add_bytes(filename: str, data: bytes) -> dict:
    """
    Uploads bytes to a local IPFS node running on 127.0.0.1:5001.
    Returns a dictionary containing the CID.
    """
    url = f"{IPFS_API}/api/v0/add?pin=true&wrap-with-directory=false"
    files = {"file": (filename, data)}

    try:
        response = requests.post(url, files=files, timeout=60)
        response.raise_for_status()  # Raise exception if status != 200
        result = response.json()
        cid = result.get("Hash")

        if not cid:
            raise Exception("CID not found in IPFS response")

        print(f"Uploaded {filename} to IPFS → CID: {cid}")
        return {"cid": cid}

    except requests.exceptions.ConnectionError:
        raise Exception(
            "Failed to connect to IPFS at 127.0.0.1:5001. "
            "Make sure your IPFS node or IPFS Desktop is running."
        )
    except Exception as e:
        raise Exception(f"IPFS upload failed: {e}")
