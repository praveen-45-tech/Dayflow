"""
Derives the full salary breakup from a SalaryComponent row.
Kept separate from the model so editing the wage always recalculates
everything on read - nothing stale gets stored.
"""


def compute_salary_breakup(sc) -> dict:
    wage = sc.monthly_wage or 0.0

    basic = wage * (sc.basic_pct_of_wage / 100)
    hra = basic * (sc.hra_pct_of_basic / 100)
    standard_allowance = sc.standard_allowance_fixed
    performance_bonus = wage * (sc.performance_bonus_pct_of_wage / 100)
    lta = wage * (sc.lta_pct_of_wage / 100)

    allocated = basic + hra + standard_allowance + performance_bonus + lta
    fixed_allowance = max(wage - allocated, 0.0)

    pf_contribution = basic * (sc.pf_pct_of_basic / 100)
    professional_tax = sc.professional_tax_fixed
    total_deductions = pf_contribution + professional_tax

    gross = basic + hra + standard_allowance + performance_bonus + lta + fixed_allowance
    net_pay = gross - total_deductions

    return {
        "monthly_wage": round(wage, 2),
        "components": {
            "basic": round(basic, 2),
            "hra": round(hra, 2),
            "standard_allowance": round(standard_allowance, 2),
            "performance_bonus": round(performance_bonus, 2),
            "leave_travel_allowance": round(lta, 2),
            "fixed_allowance": round(fixed_allowance, 2),
        },
        "deductions": {
            "pf_contribution": round(pf_contribution, 2),
            "professional_tax": round(professional_tax, 2),
            "total": round(total_deductions, 2),
        },
        "gross_pay": round(gross, 2),
        "net_pay": round(net_pay, 2),
        "working_days_per_week": sc.working_days_per_week,
        "daily_work_hours": sc.daily_work_hours,
    }


def payable_days(total_calendar_days: int, unpaid_leave_days: float, absent_days: float) -> float:
    """Any unpaid leave or missing attendance reduces payable days (per spec 3.6)."""
    return max(total_calendar_days - unpaid_leave_days - absent_days, 0)
