CREATE TABLE IF NOT EXISTS payments (  

    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    paymentintent_id VARCHAR(255) NOT NULL,
    amount_total DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_method_types VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP ,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
);
    
