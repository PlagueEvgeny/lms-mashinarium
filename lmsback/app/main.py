from fastapi import FastAPI

from app.api.router import main_api_router

app = FastAPI(title="LMS Mashinarium")

app.include_router(main_api_router)

@app.get("/")
async def root():
    return {"message": "Hello World_111"}
