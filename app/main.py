from fastapi import FastAPI
from app.v1.routes.router import router
from app.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Screenly")
app.include_router(router)