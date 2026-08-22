import random
import string

from sqlalchemy.orm import Session


def split_name(full_name: str) -> tuple[str, str]:
    """'Prannoy Didymus J' -> ('Prannoy', 'Didymus')"""
    parts = full_name.strip().split()
    first = parts[0]
    last = parts[1] if len(parts) > 1 else parts[0]
    return first, last


def generate_login_id(db: Session, company, first_name: str, last_name: str, year: int) -> str:
    """
    Format: <CompanyCode><First2><Last2><Year><Serial4>
    Example: OI + JO + DI + 2022 + 0001 -> OIJODI20220001
    Serial increments per company per year.
    """
    from app import models  # local import avoids circular import

    name_part = (first_name[:2] + last_name[:2]).upper()

    existing_count = (
        db.query(models.User)
        .filter(
            models.User.company_id == company.id,
            models.User.date_of_joining.isnot(None),
        )
        .filter(models.User.date_of_joining.between(f"{year}-01-01", f"{year}-12-31"))
        .count()
    )
    serial = str(existing_count + 1).zfill(4)
    return f"{company.code}{name_part}{year}{serial}"


def generate_temp_password(length: int = 10) -> str:
    """System-generated first-time password (Admin/HR sees this once, shares with employee)."""
    alphabet = string.ascii_letters + string.digits
    pwd = [
        random.choice(string.ascii_uppercase),
        random.choice(string.ascii_lowercase),
        random.choice(string.digits),
    ]
    pwd += random.choices(alphabet, k=length - len(pwd))
    random.shuffle(pwd)
    return "".join(pwd)
