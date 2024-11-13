CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    package_type VARCHAR(20),
    number_of_interviews INT,
    country VARCHAR(50),
    currency VARCHAR(10),
    price INT,
    features TEXT[]
);

INSERT INTO packages (package_type, number_of_interviews, country, currency, price, features)
VALUES
    ('MOCK_INTERVIEW', 1, 'INDIA', 'INR', 349, ARRAY['AI screening', 'One mock interview']),
    ('MOCK_INTERVIEW', 1, 'UK', 'GBP', 399, ARRAY['AI screening', 'One mock interview']),
    ('MOCK_INTERVIEW', 1, 'US', 'USD', 399, ARRAY['AI screening', 'One mock interview']);

INSERT INTO packages (package_type, number_of_interviews, country, currency, price, features)
VALUES
    ('CORPORATE_INTERVIEW', 10, 'INDIA', 'INR', 9999, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
    ('CORPORATE_INTERVIEW', 10, 'UK', 'GBP', 99, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
    ('CORPORATE_INTERVIEW', 10, 'US', 'USD', 129, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),

    ('CORPORATE_INTERVIEW', 20, 'INDIA', 'INR', 16999, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
    ('CORPORATE_INTERVIEW', 20, 'UK', 'GBP', 169, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
    ('CORPORATE_INTERVIEW', 20, 'US', 'USD', 199, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),

    ('CORPORATE_INTERVIEW', 50, 'INDIA', 'INR', 34999, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
    ('CORPORATE_INTERVIEW', 50, 'UK', 'GBP', 349, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
    ('CORPORATE_INTERVIEW', 50, 'US', 'USD', 399, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']);
