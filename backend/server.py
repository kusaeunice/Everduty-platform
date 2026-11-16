
    
  
    return {"id": job_id, "message": "Permanent job posted"}

@api_router.get("/agency/permanent-jobs")
def get_agency_jobs(user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("id").eq("owner_id", user["id"]).execute())
    if not agency:
        return []
    return sb.table("permanent_jobs").select("*").eq("agency_id", agency["id"]).order("created_at", desc=True).limit(200).execute().data

@api_router.get("/agency/workers")
def get_agency_workers(user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("id").eq("owner_id", user["id"]).execute())
    if not agency:
        return []
    profiles = sb.table("worker_profiles").select("*").eq("agency_id", agency["id"]).execute().data
    result = []
    for p in profiles:
        w = sb_first(sb.table("users").select("id,email,full_name,phone,country,status").eq("id", p["user_id"]).execute())
        if w:
            w["profile"] = p
            result.append(w)
    return result

@api_router.post("/agency/invite-worker")
def invite_worker_to_agency(data: AgencyInviteWorker, user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("id").eq("owner_id", user["id"]).execute())
    if not agency:
        raise HTTPException(status_code=400, detail="Register your agency first")
    worker_user = sb_first(sb.table("users").select("id").eq("email", data.worker_email).eq("role", "worker").execute())
    if not worker_user:
        raise HTTPException(status_code=404, detail="Worker not found with that email")
    profile = sb_first(sb.table("worker_profiles").select("id,agency_id").eq("user_id", worker_user["id"]).execute())
    if profile and profile.get("agency_id") and profile["agency_id"] == agency["id"]:
        raise HTTPException(status_code=400, detail="Worker already in your pool")
    sb.table("worker_profiles").update({"agency_id": agency["id"]}).eq("user_id", worker_user["id"]).execute()
    sb_inc("agencies", agency["id"], "worker_pool_count")
    return {"message": f"Worker added to your pool"}

@api_router.post("/agency/remove-worker/{worker_id}")
def remove_worker_from_agency(worker_id: str, user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("id").eq("owner_id", user["id"]).execute())
    if not agency:
        raise HTTPException(status_code=400, detail="No agency")
    sb.table("worker_profiles").update({"agency_id": ""}).eq("user_id", worker_id).eq("agency_id", agency["id"]).execute()
    return {"message": "Worker removed from pool"}

@api_router.get("/agency/applicants")
def get_agency_applicants(user=Depends(get_current_user)):
    require_role(user, ["agency"])
    apps = sb.table("shift_applications").select("*").eq("employer_id", user["id"]).order("applied_at", desc=True).limit(200).execute().data
    for a in apps:
        a["worker"] = sb_first(sb.table("users").select("id,email,full_name,phone,country,status").eq("id", a["worker_id"]).execute())
        a["shift"] = sb_first(sb.table("shifts").select("title,date,location,hourly_rate").eq("id", a["shift_id"]).execute())
    return apps

@api_router.post("/agency/applications/{app_id}/{action}")
def handle_agency_application(app_id: str, action: str, user=Depends(get_current_user)):
    require_role(user, ["agency"])
    if action not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    status = "accepted" if action == "accept" else "rejected"
    sb.table("shift_applications").update({"status": status}).eq("id", app_id).execute()
    if action == "accept":
        application = sb_first(sb.table("shift_applications").select("shift_id").eq("id", app_id).execute())
        if application:
            accepted = sb_count("shift_applications", shift_id=application["shift_id"], status="accepted")
            shift = sb_first(sb.table("shifts").select("positions").eq("id", application["shift_id"]).execute())
            if shift and accepted >= shift.get("positions", 1):
                sb.table("shifts").update({"filled_positions": accepted, "status": "filled"}).eq("id", application["shift_id"]).execute()
    return {"message": f"Application {status}"}

@api_router.get("/agency/timesheets")
def get_agency_timesheets(user=Depends(get_current_user)):
    require_role(user, ["agency"])
    return sb.table("timesheets").select("*").eq("employer_id", user["id"]).execute().data

@api_router.get("/agency/shared-workers")
def browse_shared_workers(industry: Optional[str] = None, user=Depends(get_current_user)):
    require_role(user, ["agency"])
    q = sb.table("worker_profiles").select("*").eq("compliance_status", "approved")
    if industry:
        q = q.contains("industries", [industry])
    profiles = q.limit(200).execute().data
    result = []
    for p in profiles:
        w = sb_first(sb.table("users").select("id,full_name,country,status").eq("id", p["user_id"]).execute())
        if w:
            w["profile"] = p
            result.append(w)
    return result

# ============ ADMIN AGENCY MANAGEMENT ============

@api_router.get("/admin/agencies")
def admin_get_agencies(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    agencies = sb.table("agencies").select("*").order("created_at", desc=True).limit(500).execute().data
    for a in agencies:
        owner = sb_first(sb.table("users").select("full_name,email").eq("id", a["owner_id"]).execute())
        a["owner_name"] = owner["full_name"] if owner else "Unknown"
        a["owner_email"] = owner["email"] if owner else ""
    return agencies

@api_router.post("/admin/agencies/{agency_id}/approve")
def admin_approve_agency(agency_id: str, user=Depends(get_current_user)):
    require_role(user, ["admin"])
    sb.table("agencies").update({"status": "active"}).eq("id", agency_id).execute()
    return {"message": "Agency approved"}

@api_router.post("/admin/agencies/{agency_id}/suspend")
def admin_suspend_agency(agency_id: str, user=Depends(get_current_user)):
    require_role(user, ["admin"])
    sb.table("agencies").update({"status": "suspended"}).eq("id", agency_id).execute()
    return {"message": "Agency suspended"}

@api_router.post("/admin/agencies/{agency_id}/commission")
def admin_set_commission(agency_id: str, rate: float = Query(...), user=Depends(get_current_user)):
    require_role(user, ["admin"])
    sb.table("agencies").update({"commission_rate": rate}).eq("id", agency_id).execute()
    return {"message": f"Commission rate set to {rate}%"}

# ============ APP SETUP ============

app.include_router(api_router)

