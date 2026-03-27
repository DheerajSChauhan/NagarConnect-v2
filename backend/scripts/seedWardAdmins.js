const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config({ path: "./.env" });

const supabase = require("../config/supabase");

const seedWardAdmins = async () => {
  try {
    for (let i = 1; i <= 20; i++) {
      const email = `wardadmin${i}@nagarsaathi.com`;
      const plainPassword = `ward@${i}`;
      const wardNumber = `${i}`;

      const { data: existingUser, error: lookupError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (existingUser) {
        console.log(`Already exists: ${email}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const { error: createError } = await supabase.from("users").insert({
        name: `Ward Admin ${i}`,
        email,
        password: hashedPassword,
        ward: wardNumber,
        phone: `99999999${String(i).padStart(2, "0")}`,
        role: "wardAdmin",
      });

      if (createError) throw createError;
      console.log(`Created: ${email} | Password: ${plainPassword}`);
    }

    console.log("Seeding complete");
    process.exit(0);
  } catch (error) {
    console.error("Seeding ward admins failed:", error.message);
    process.exit(1);
  }
};

seedWardAdmins();
