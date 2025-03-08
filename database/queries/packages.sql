DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'package_type') THEN
        CREATE TYPE package_type AS ENUM ('ONETIME', 'RECURRING');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_id VARCHAR(255) DEFAULT NULL,
    user_type VARCHAR(255) NOT NULL,
    package_type package_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    number_of_interviews INT,
    country VARCHAR(50),
    currency VARCHAR(10),
    price DECIMAL,
    features TEXT[]
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM packages) THEN
        INSERT INTO packages (price_id, user_type, package_type, name, number_of_interviews, country, currency, price, features)
        VALUES
            ('', 'STUDENT', 'ONETIME', 'One Interview', 1, 'IND', 'INR', 349, ARRAY['One Time One Practise Interview', 'Personalized Feedback ', 'Rank against competitors']),
            ('', 'STUDENT', 'ONETIME', 'One Interview', 1, 'GBR', 'GBP', 3.49, ARRAY['One Time One Practise Interview', 'Personalized Feedback ', 'Rank against competitors']),
            ('', 'STUDENT', 'ONETIME', 'One Interview', 1, 'US', 'USD', 3.99, ARRAY['One Time One Practise Interview', 'Personalized Feedback ', 'Rank against competitors']),
            ('', 'STUDENT', 'ONETIME', 'One Interview', 1, 'DEU', 'EUR', 3.99, ARRAY['One Time One Practise Interview', 'Personalized Feedback ', 'Rank against competitors']),

            ('price_1R01BsHd41ke4PyTtMmLSuVA', 'STUDENT', 'RECURRING', 'Gold', 5, 'IND', 'INR', 999, ARRAY['5 Practise Interviews', 'Personalized Feedback ', 'Rank against competitors']),
            ('price_1R01D4Hd41ke4PyTGX9c7NuY', 'STUDENT', 'RECURRING', 'Gold', 5, 'GBR', 'GBP', 9.99, ARRAY['5 Practise Interviews', 'Personalized Feedback ', 'Rank against competitors']),
            ('price_1Qze8PHd41ke4PyTMDtpY1ck', 'STUDENT', 'RECURRING', 'Gold', 5, 'US', 'USD', 14.99, ARRAY['5 Practise Interviews', 'Personalized Feedback ', 'Rank against competitors']),
            ('price_1R01CeHd41ke4PyTOwIdPFdN', 'STUDENT', 'RECURRING', 'Gold', 5, 'DEU', 'EUR', 14.99, ARRAY['5 Practise Interviews', 'Personalized Feedback ', 'Rank against competitors']),

            ('price_1R01EeHd41ke4PyTTzd6k9oW', 'STUDENT', 'RECURRING', 'Platinum', 12, 'IND', 'INR', 1999, ARRAY['12 Practise Interviews', 'Personalized Feedback ', 'Rank against competitors']),
            ('price_1R01FPHd41ke4PyTZZ09L31B', 'STUDENT', 'RECURRING', 'Platinum', 12, 'GBR', 'GBP', 19.99, ARRAY['12 Practise Interviews', 'Personalized Feedback ', 'Rank against competitors']),
            ('price_1Qze9kHd41ke4PyTbGEGaLcO', 'STUDENT', 'RECURRING', 'Platinum', 12, 'US', 'USD', 24.99, ARRAY['12 Practise Interviews', 'Personalized Feedback ', 'Rank against competitors']),
            ('price_1R01F0Hd41ke4PyTy3rHvsdU', 'STUDENT', 'RECURRING', 'Platinum', 12, 'DEU', 'EUR', 24.99, ARRAY['12 Practise Interviews', 'Personalized Feedback ', 'Rank against competitors']),

            ('', 'RECRUITER', 'ONETIME', '10 AI Interviews', 10, 'IND', 'INR', 2999, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 10 candidates']),
            ('', 'RECRUITER', 'ONETIME', '10 AI Interviews', 10, 'GBR', 'GBP', 29, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 10 candidates']),
            ('', 'RECRUITER', 'ONETIME', '10 AI Interviews', 10, 'US', 'USD', 39, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 10 candidates']),
            ('', 'RECRUITER', 'ONETIME', '10 AI Interviews', 10, 'DEU', 'EUR', 39, ARRAY['Access to all candidates', 'Sponsored listing', 'AI Screening of all candidates', 'AI Interview of 10 candidates']),

            ('price_1R01GWHd41ke4PyTSPL76EFT', 'RECRUITER', 'RECURRING', 'Gold', 100, 'IND', 'INR', 19999, ARRAY['Access to all applicants', '5 users', 'Sponsored listing', 'AI Screening of all candidates', '100 AI Interviews/month', 'Shout out on social media']),
            ('price_1R01GlHd41ke4PyTHROAFMQH', 'RECRUITER', 'RECURRING', 'Gold', 100, 'GBR', 'GBP', 199, ARRAY['Access to all applicants', '5 users', 'Sponsored listing', 'AI Screening of all candidates', '100 AI Interviews/month', 'Shout out on social media']),
            ('price_1QzeB0Hd41ke4PyTTOcGyqpk', 'RECRUITER', 'RECURRING', 'Gold', 100, 'US', 'USD', 249, ARRAY['Access to all applicants', '5 users', 'Sponsored listing', 'AI Screening of all candidates', '100 AI Interviews/month', 'Shout out on social media']),
            ('price_1R01H1Hd41ke4PyTfJoU2XdZ', 'RECRUITER', 'RECURRING', 'Gold', 100, 'DEU', 'EUR', 249, ARRAY['Access to all applicants', '5 users', 'Sponsored listing', 'AI Screening of all candidates', '100 AI Interviews/month', 'Shout out on social media']),

            ('price_1R01I4Hd41ke4PyTRPBsZqE4', 'RECRUITER', 'RECURRING', 'Platinum', 500, 'IND', 'INR', 49999, ARRAY['Access to all applicants', '20 users', 'Sponsored listing', 'AI Screening of all candidates', 'AI screening of your database', '500 AI Interviews', 'Shout out on social media']),
            ('price_1R01IJHd41ke4PyTnZEFv4E8', 'RECRUITER', 'RECURRING', 'Platinum', 500, 'GBR', 'GBP', 599, ARRAY['Access to all applicants', '20 users', 'Sponsored listing', 'AI Screening of all candidates', 'AI screening of your database', '500 AI Interviews', 'Shout out on social media']),
            ('price_1QzeC4Hd41ke4PyTjYcLRhUZ', 'RECRUITER', 'RECURRING', 'Platinum', 500, 'US', 'USD', 749, ARRAY['Access to all applicants', '20 users', 'Sponsored listing', 'AI Screening of all candidates', 'AI screening of your database', '500 AI Interviews', 'Shout out on social media']),
            ('price_1R01IZHd41ke4PyT9xG3ukx6', 'RECRUITER', 'RECURRING', 'Platinum', 500, 'DEU', 'EUR', 749, ARRAY['Access to all applicants', '20 users', 'Sponsored listing', 'AI Screening of all candidates', 'AI screening of your database', '500 AI Interviews', 'Shout out on social media']);
    END IF;
END $$;
