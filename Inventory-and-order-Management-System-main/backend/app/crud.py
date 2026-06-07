from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from . import models, schemas

# --- Product CRUD ---

def get_product(db: Session, product_id: int):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    return product

def get_products(db: Session):
    return db.query(models.Product).order_by(models.Product.id.asc()).all()

def create_product(db: Session, product: schemas.ProductCreate):
    # Rule: SKU must be unique
    existing_sku = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if existing_sku:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists"
        )
    
    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    
    # Rule: If SKU is changing, it must remain unique
    if product_update.sku is not None and product_update.sku != db_product.sku:
        existing_sku = db.query(models.Product).filter(models.Product.sku == product_update.sku).first()
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{product_update.sku}' already exists"
            )
            
    # Apply updates
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    db.delete(db_product)
    db.commit()
    return db_product


# --- Customer CRUD ---

def get_customer(db: Session, customer_id: int):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
    return customer

def get_customers(db: Session):
    return db.query(models.Customer).order_by(models.Customer.id.asc()).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    # Rule: Email must be unique
    existing_email = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already exists"
        )
        
    db_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    db.delete(db_customer)
    db.commit()
    return db_customer


# --- Order CRUD ---

def get_order(db: Session, order_id: int):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    # Populate customer name and item details for response
    return format_order_response(order)

def get_orders(db: Session):
    orders = db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    return [format_order_response(order) for order in orders]

def create_order(db: Session, order_in: schemas.OrderCreate):
    # 1. Verify customer exists
    customer = get_customer(db, order_in.customer_id)
    
    # 2. Check stock, validate products, calculate total, and deduct stock
    total_amount = 0.0
    order_items_to_create = []
    
    # Track products to update in bulk to keep transaction atomic
    products_to_update = []
    
    for item in order_in.items:
        # Get product
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found"
            )
            
        # Rule: Inventory must be sufficient
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for product '{product.name}'. Requested: {item.quantity}, Available: {product.quantity}"
            )
            
        # Rule: Deduct stock automatically
        product.quantity -= item.quantity
        products_to_update.append(product)
        
        # Rule: Total order amount calculated automatically by the backend
        item_total = product.price * item.quantity
        total_amount += item_total
        
        # Store for order item instantiation
        order_items_to_create.append(
            models.OrderItem(
                product_id=product.id,
                quantity=item.quantity
            )
        )
        
    # 3. Create the Order
    db_order = models.Order(
        customer_id=customer.id,
        total_amount=total_amount,
        items=order_items_to_create
    )
    
    db.add(db_order)
    
    # Commit changes transactionally
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to place order: {str(e)}"
        )
        
    db.refresh(db_order)
    return format_order_response(db_order)

def delete_order(db: Session, order_id: int):
    # Cancel/Delete an order
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
        
    # Optional logic: we can restore stock when an order is cancelled/deleted.
    # The requirement is "Cancel/Delete an order". Let's restore the stock to the products!
    # This is standard inventory behavior and makes the application feel extremely robust.
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity
            
    db.delete(order)
    db.commit()
    return order


# --- Helper to format OrderOut schemas ---
def format_order_response(order: models.Order):
    # Custom mapper to attach customer_name and product details
    items_out = []
    for item in order.items:
        items_out.append(
            schemas.OrderItemOut(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                product_name=item.product.name if item.product else "Unknown Product",
                product_price=item.product.price if item.product else 0.0
            )
        )
        
    return schemas.OrderOut(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name if order.customer else "Unknown Customer",
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=items_out
    )


# --- Dashboard Stats ---

def get_dashboard_stats(db: Session):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    # Low stock: let's define low stock as quantity < 10
    low_stock_products = db.query(models.Product).filter(models.Product.quantity < 10).all()
    low_stock_count = len(low_stock_products)
    
    return schemas.DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_count=low_stock_count,
        low_stock_products=[
            schemas.ProductOut.model_validate(p) for p in low_stock_products
        ]
    )
