from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.services.investigation_manager import InvestigationManager

_manager = InvestigationManager()


def get_investigation_manager() -> InvestigationManager:
    return _manager


def get_db():
    db: Session = SessionLocal()

    try:
        yield db
    finally:
        db.close()