-- Drop all existing policies
DROP POLICY IF EXISTS "Admins have full access to users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile except role" ON users;
DROP POLICY IF EXISTS "Admins have full access to promises" ON promises;
DROP POLICY IF EXISTS "Users can read own promises" ON promises;
DROP POLICY IF EXISTS "Admins have full access to payments" ON payments;
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "Admins have full access to chanda_types" ON chanda_types;
DROP POLICY IF EXISTS "Users can read chanda_types" ON chanda_types;
DROP POLICY IF EXISTS "Admins have full access to quotes" ON quotes;
DROP POLICY IF EXISTS "Users can read quotes" ON quotes;