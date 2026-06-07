from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import engine, Base, get_db
from . import schemas, crud

# Initialize database tables on startup (fast and reliable for docker orchestration)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="Backend API for managing products, customers, and ordering logic.",
    version="1.0.0"
)

# CORS configurations to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", status_code=status.HTTP_200_OK)
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the Inventory & Order Management System API",
        "docs_url": "/docs"
    }


# --- Dashboard Endpoint ---

@app.get("/dashboard/stats", response_model=schemas.DashboardStats, status_code=status.HTTP_200_OK)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


# --- Product Endpoints ---

@app.post("/products", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, product)

@app.get("/products", response_model=List[schemas.ProductOut], status_code=status.HTTP_200_OK)
def read_products(db: Session = Depends(get_db)):
    return crud.get_products(db)

@app.get("/products/{id}", response_model=schemas.ProductOut, status_code=status.HTTP_200_OK)
def read_product(id: int, db: Session = Depends(get_db)):
    return crud.get_product(db, id)

@app.put("/products/{id}", response_model=schemas.ProductOut, status_code=status.HTTP_200_OK)
def update_product(id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    return crud.update_product(db, id, product)

@app.delete("/products/{id}", response_model=schemas.ProductOut, status_code=status.HTTP_200_OK)
def delete_product(id: int, db: Session = Depends(get_db)):
    return crud.delete_product(db, id)


# --- Customer Endpoints ---

@app.post("/customers", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, customer)

@app.get("/customers", response_model=List[schemas.CustomerOut], status_code=status.HTTP_200_OK)
def read_customers(db: Session = Depends(get_db)):
    return crud.get_customers(db)

@app.get("/customers/{id}", response_model=schemas.CustomerOut, status_code=status.HTTP_200_OK)
def read_customer(id: int, db: Session = Depends(get_db)):
    return crud.get_customer(db, id)

@app.delete("/customers/{id}", response_model=schemas.CustomerOut, status_code=status.HTTP_200_OK)
def delete_customer(id: int, db: Session = Depends(get_db)):
    return crud.delete_customer(db, id)


# --- Order Endpoints ---

@app.post("/orders", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db, order)

@app.get("/orders", response_model=List[schemas.OrderOut], status_code=status.HTTP_200_OK)
def read_orders(db: Session = Depends(get_db)):
    return crud.get_orders(db)

@app.get("/orders/{id}", response_model=schemas.OrderOut, status_code=status.HTTP_200_OK)
def read_order(id: int, db: Session = Depends(get_db)):
    return crud.get_order(db, id)

@app.delete("/orders/{id}", response_model=schemas.OrderOut, status_code=status.HTTP_200_OK)
def delete_order(id: int, db: Session = Depends(get_db)):
    return crud.delete_order(db, id)
