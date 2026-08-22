import datetime as dt
import enum

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum, Float, ForeignKey, Integer,
    String, Text, UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


# ---------------------------------------------------------------- enums ----
class Role(str, enum.Enum):
    admin = "admin"          # Admin / HR Officer
    employee = "employee"


class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    half_day = "half_day"
    leave = "leave"


class TimeOffType(str, enum.Enum):
    paid = "paid"
    sick = "sick"
    unpaid = "unpaid"


class TimeOffStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


# --------------------------------------------------------------- models ----
class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)  # e.g. "OI" -> used in login IDs
    logo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    users = relationship("User", back_populates="company")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("login_id", name="uq_users_login_id"),)

    id = Column(Integer, primary_key=True, index=True)
    login_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(Role), default=Role.employee, nullable=False)
    must_change_password = Column(Boolean, default=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    company = relationship("Company", back_populates="users")

    # job details
    job_position = Column(String, nullable=True)
    department = Column(String, nullable=True)
    manager = Column(String, nullable=True)
    location = Column(String, nullable=True)
    date_of_joining = Column(Date, nullable=True)
    emp_code = Column(String, nullable=True)

    # profile picture
    avatar_url = Column(String, nullable=True)

    # resume tab
    about = Column(Text, nullable=True)
    what_i_love = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)       # comma-separated for demo simplicity
    interests = Column(Text, nullable=True)    # comma-separated

    # private info tab
    date_of_birth = Column(Date, nullable=True)
    residing_address = Column(Text, nullable=True)
    nationality = Column(String, nullable=True)
    personal_email = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    marital_status = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    ifsc_code = Column(String, nullable=True)
    pan_no = Column(String, nullable=True)
    uan_no = Column(String, nullable=True)

    created_at = Column(DateTime, default=dt.datetime.utcnow)

    salary_component = relationship("SalaryComponent", back_populates="user", uselist=False)
    attendances = relationship("Attendance", back_populates="user")
    time_off_requests = relationship("TimeOffRequest", back_populates="user")
    time_off_allocations = relationship("TimeOffAllocation", back_populates="user")


class SalaryComponent(Base):
    """
    Stores the wage + configurable percentage rules for a user.
    Absolute amounts are derived at read-time (see app/payroll.py) so that
    editing the wage automatically recalculates every component.
    """
    __tablename__ = "salary_components"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    user = relationship("User", back_populates="salary_component")

    monthly_wage = Column(Float, nullable=False, default=0)

    # component rates - all % unless noted
    basic_pct_of_wage = Column(Float, default=50.0)
    hra_pct_of_basic = Column(Float, default=50.0)
    standard_allowance_fixed = Column(Float, default=4167.0)
    performance_bonus_pct_of_wage = Column(Float, default=8.33)
    lta_pct_of_wage = Column(Float, default=8.333)

    # deductions
    pf_pct_of_basic = Column(Float, default=12.0)
    professional_tax_fixed = Column(Float, default=200.0)

    working_days_per_week = Column(Integer, default=5)
    daily_work_hours = Column(Float, default=8.0)

    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_attendance_user_date"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="attendances")

    date = Column(Date, nullable=False, default=dt.date.today)
    check_in = Column(String, nullable=True)    # "HH:MM"
    check_out = Column(String, nullable=True)   # "HH:MM"
    work_hours = Column(Float, default=0.0)
    extra_hours = Column(Float, default=0.0)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.absent)


class TimeOffAllocation(Base):
    """Yearly allocation bucket per leave type, e.g. 24 paid days / 7 sick days."""
    __tablename__ = "time_off_allocations"
    __table_args__ = (UniqueConstraint("user_id", "type", name="uq_alloc_user_type"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="time_off_allocations")

    type = Column(Enum(TimeOffType), nullable=False)
    total_days = Column(Float, default=0)
    used_days = Column(Float, default=0)


class TimeOffRequest(Base):
    __tablename__ = "time_off_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="time_off_requests")

    type = Column(Enum(TimeOffType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    allocation_days = Column(Float, default=0)
    remarks = Column(Text, nullable=True)
    attachment_url = Column(String, nullable=True)  # for sick-leave certificates

    status = Column(Enum(TimeOffStatus), default=TimeOffStatus.pending)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_comment = Column(Text, nullable=True)

    created_at = Column(DateTime, default=dt.datetime.utcnow)
