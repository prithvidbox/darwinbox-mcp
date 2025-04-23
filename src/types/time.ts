export interface MonthlyAttendance {
  emp_number_list: string[];
  from_date: string;
  to_date: string;
  month: string;
}

export interface DailyAttendance {
  emp_number_list: string[];
  attendance_date: string;
}

export interface AttendanceRoster {
  emp_number_list: string[];
  from_date: string;
  to_date: string;
}

export interface AttendancePunch {
  attendance: {
    [employeeId: string]: Array<{
      id: string;
      timestamp: string;
      machineid: string;
      status: string;
    }>;
  };
}

export interface BackdatedAttendance {
  attendance_data: Array<{
    employee_no: string;
    shift_date: string;
    in_time_date: string;
    in_time: string;
    out_time_date: string;
    out_time: string;
    shift_name: string;
    policy_name: string;
    weekly_off_name: string;
    break_duration: string;
  }>;
}

export interface LeaveAction {
  leave_id: string;
  employee_no: string;
  action: string;
  manager_message: string;
}

export interface LeaveActionHistory {
  from: string;
  to: string;
  action: string;
  employee_no: string[];
  unpaid: string;
}

export interface HolidayList {
  year: string;
  employee_no: string;
}

export interface LeaveBalance {
  ignore_rounding: string;
  employee_nos: string[];
  leave_names: string[];
}

export interface ImportLeave {
  data: Array<{
    employee_no: string;
    leave_name: string;
    message: string;
    from_date: string;
    to_date: string;
    is_half_day: string;
    is_firsthalf_secondhalf: string;
    is_paid_or_unpaid: string;
    revoke_leave: string;
    revoke_reason: string;
  }>;
}
