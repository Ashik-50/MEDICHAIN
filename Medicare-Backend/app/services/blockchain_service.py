# app/services/blockchain_service.py
from sqlalchemy.orm import Session
from app.models.blockchain import Block
from datetime import datetime
import hashlib
import json

def calculate_hash(index, timestamp, data, previous_hash):
    block_string = f"{index}{timestamp}{json.dumps(data, sort_keys=True)}{previous_hash}"
    return hashlib.sha256(block_string.encode()).hexdigest()

def get_last_block(db: Session):
    return db.query(Block).order_by(Block.index.desc()).first()

def add_block(db: Session, data: dict):
    """
    Create and store a new block in DB. `data` should be JSON-serializable.
    Returns the created Block model instance.
    """
    last_block = get_last_block(db)
    previous_hash = last_block.hash if last_block else "0"
    index = last_block.index + 1 if last_block else 0
    timestamp = datetime.utcnow().isoformat()

    block_hash = calculate_hash(index, timestamp, data, previous_hash)

    new_block = Block(
        index=index,
        timestamp=timestamp,
        data=json.dumps(data),
        previous_hash=previous_hash,
        hash=block_hash
    )

    db.add(new_block)
    db.commit()
    db.refresh(new_block)
    return new_block

def verify_chain(db):
    """
    Simple verification that checks if all blocks exist and have valid fields.
    """
    blocks = db.query(Block).order_by(Block.id).all()

    if not blocks:
        return {"valid": True, "total_blocks": 0}

    for block in blocks:
        if not block.hash_value or not block.timestamp:
            return {"valid": False, "total_blocks": len(blocks)}

    return {"valid": True, "total_blocks": len(blocks)}


def get_all_blocks(db: Session):
    blocks = db.query(Block).order_by(Block.index).all()
    return [
        {
            "index": b.index,
            "timestamp": b.timestamp,
            "data": json.loads(b.data),
            "previous_hash": b.previous_hash,
            "hash": b.hash,
        }
        for b in blocks
    ]

def find_blocks_by_record_id(db: Session, record_id: int):
    blocks = db.query(Block).filter(Block.data.like(f'%\"record_id\": {record_id}%')).order_by(Block.index).all()
    return [
        {
            "index": b.index,
            "timestamp": b.timestamp,
            "data": json.loads(b.data),
            "previous_hash": b.previous_hash,
            "hash": b.hash,
        }
        for b in blocks
    ]
