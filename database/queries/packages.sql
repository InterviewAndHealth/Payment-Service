CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_type VARCHAR(20),
    number_of_interviews INT,
    country VARCHAR(50),
    currency VARCHAR(10),
    price INT,
    features TEXT[]
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM packages) THEN
        INSERT INTO packages (package_type, number_of_interviews, country, currency, price, features)
        VALUES
            ('STUDENT', 1, 'IND', 'INR', 349, ARRAY['AI screening', '1 mock interview']),
            ('STUDENT', 1, 'GBR', 'GBP', 3.99, ARRAY['AI screening', '1 mock interview']),
            ('STUDENT', 1, 'US', 'USD', 3.99, ARRAY['AI screening', '1 mock interview']),
            ('STUDENT', 1, 'DEU', 'EUR', 3.99, ARRAY['AI screening', '1 mock interview']),

            ('STUDENT', 5, 'IND', 'INR', 1399, ARRAY['AI screening', '5 mock interview']),
            ('STUDENT', 5, 'GBR', 'GBP', 16.99, ARRAY['AI screening', '5 mock interview']),
            ('STUDENT', 5, 'US', 'USD', 16.99, ARRAY['AI screening', '5 mock interview']),
            ('STUDENT', 5, 'DEU', 'EUR', 3.99, ARRAY['AI screening', '5 mock interview']),

            ('STUDENT', 10, 'IND', 'INR', 2499, ARRAY['AI screening', '10 mock interview']),
            ('STUDENT', 10, 'GBR', 'GBP', 24.99, ARRAY['AI screening', '10 mock interview']),
            ('STUDENT', 10, 'US', 'USD', 24.99, ARRAY['AI screening', '10 mock interview']),
            ('STUDENT', 10, 'DEU', 'EUR', 3.99, ARRAY['AI screening', '10 mock interview']),

            ('RECRUITER', 10, 'IND', 'INR', 9999, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 10 candidates']),
            ('RECRUITER', 10, 'GBR', 'GBP', 99, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 10 candidates']),
            ('RECRUITER', 10, 'US', 'USD', 129, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 10 candidates']),
            ('RECRUITER', 10, 'DEU', 'EUR', 129, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 10 candidates']),

            ('RECRUITER', 20, 'IND', 'INR', 16999, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 20 candidates', 'Shout out on social media']),
            ('RECRUITER', 20, 'GBR', 'GBP', 169, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 20 candidates', 'Shout out on social media']),
            ('RECRUITER', 20, 'US', 'USD', 199, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 20 candidates', 'Shout out on social media']),
            ('RECRUITER', 20, 'DEU', 'EUR', 199, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 20 candidates', 'Shout out on social media']),

            ('RECRUITER', 50, 'IND', 'INR', 34999, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 50 candidates', 'Shout out on social media']),
            ('RECRUITER', 50, 'GBR', 'GBP', 349, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 50 candidates', 'Shout out on social media']),
            ('RECRUITER', 50, 'US', 'USD', 399, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 50 candidates', 'Shout out on social media']),
            ('RECRUITER', 50, 'DEU', 'EUR', 399, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 50 candidates', 'Shout out on social media']);
    END IF;
END $$;
