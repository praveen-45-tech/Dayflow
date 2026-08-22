"""
Populate Dayflow with a demo company, an Admin/HR account and a handful of
employees so judges can explore the app immediately.

Run with:  python seed.py
"""
import datetime as dt

from app.database import Base, engine, SessionLocal
from app import models, security, utils

Base.metadata.create_all(bind=engine)
db = SessionLocal()

DEMO_PASSWORD = "Dayflow@123"


def get_or_create_company():
    company = db.query(models.Company).filter(models.Company.name == "Odoo India").first()
    if company:
        return company
    company = models.Company(name="Odoo India", code="OI", logo_url=None)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def create_user(company, full_name, email, role, job_position, department, manager,
                 location, joining_date, wage, gender="Prefer not to say"):
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        return existing

    first, last = utils.split_name(full_name)
    login_id = utils.generate_login_id(db, company, first, last, joining_date.year)

    user = models.User(
        login_id=login_id,
        name=full_name,
        email=email,
        password_hash=security.hash_password(DEMO_PASSWORD),
        role=role,
        must_change_password=False,
        company_id=company.id,
        job_position=job_position,
        department=department,
        manager=manager,
        location=location,
        date_of_joining=joining_date,
        emp_code=login_id,
        gender=gender,
        phone="+91 90000 00000",
        about=f"{full_name.split()[0]} is a valued member of the {department} team at Odoo India, "
              f"working as {job_position}.",
        what_i_love="Solving real problems for real people, one workday at a time.",
        skills="Communication, Collaboration, Problem Solving",
        interests="Reading, Cricket, Traveling",
    )
    db.add(user)
    db.flush()

    salary = models.SalaryComponent(user_id=user.id, monthly_wage=wage)
    db.add(salary)

    db.add(models.TimeOffAllocation(user_id=user.id, type=models.TimeOffType.paid,
                                     total_days=24, used_days=0))
    db.add(models.TimeOffAllocation(user_id=user.id, type=models.TimeOffType.sick,
                                     total_days=7, used_days=0))
    db.commit()
    db.refresh(user)
    return user


def seed_attendance(user, days_back=10):
    today = dt.date.today()
    for i in range(days_back):
        day = today - dt.timedelta(days=i)
        if day.weekday() >= 5:
            continue
        exists = db.query(models.Attendance).filter(
            models.Attendance.user_id == user.id, models.Attendance.date == day
        ).first()
        if exists:
            continue
        att = models.Attendance(
            user_id=user.id, date=day, check_in="10:00", check_out="19:00",
            work_hours=8.0, extra_hours=1.0, status=models.AttendanceStatus.present,
        )
        db.add(att)
    db.commit()


def main():
    company = get_or_create_company()

    admin = create_user(
        company, "Anish Kumar", "admin@dayflow.dev", models.Role.admin,
        "HR Administrator", "Human Resources", "-", dt.date(2022, 1, 10), 90000,
    )

    employees = [
        ("Prannoy Didymus J", "prannoy@dayflow.dev", "Software Engineer", "Engineering",
         "Anish Kumar", "Chennai", dt.date(2022, 6, 15), 50000),
        ("Varnika Sasikumar", "varnika@dayflow.dev", "Product Designer", "Design",
         "Anish Kumar", "Bengaluru", dt.date(2023, 3, 1), 55000),
        ("Rahul Menon", "rahul@dayflow.dev", "QA Engineer", "Engineering",
         "Prannoy Didymus J", "Chennai", dt.date(2023, 8, 21), 42000),
        ("Sneha Iyer", "sneha@dayflow.dev", "Marketing Executive", "Marketing",
         "Anish Kumar", "Madurai", dt.date(2024, 1, 5), 38000),
    ]

    created = [admin]
    for name, email, job, dept, manager, loc, joined, wage in employees:
        u = create_user(company, name, email, models.Role.employee, job, dept, manager, loc, joined, wage)
        created.append(u)

    for u in created:
        seed_attendance(u)

    # A sample pending time off request so the approval queue isn't empty
    prannoy = db.query(models.User).filter(models.User.email == "prannoy@dayflow.dev").first()
    if prannoy and not db.query(models.TimeOffRequest).filter(
            models.TimeOffRequest.user_id == prannoy.id).first():
        start = dt.date.today() + dt.timedelta(days=3)
        end = start + dt.timedelta(days=1)
        db.add(models.TimeOffRequest(
            user_id=prannoy.id, type=models.TimeOffType.paid, start_date=start, end_date=end,
            allocation_days=2, remarks="Family function", status=models.TimeOffStatus.pending,
        ))
        db.commit()

    print("Seed complete.")
    print("-" * 60)
    print(f"Company : {company.name} ({company.code})")
    print(f"Admin   : login_id={admin.login_id}  email={admin.email}  password={DEMO_PASSWORD}")
    for u in created[1:]:
        print(f"Employee: login_id={u.login_id}  email={u.email}  password={DEMO_PASSWORD}")
    print("-" * 60)


if __name__ == "__main__":
    main()
    db.close()
