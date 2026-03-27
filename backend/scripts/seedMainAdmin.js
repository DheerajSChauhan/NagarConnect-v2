const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config({ path: "./.env" });

const supabase = require("../config/supabase");

const mainAdminEmail = "mainadmin@nagarsaathi.com";
const mainAdminPassword = "main@123";

const seedMainAdmin = async () => {
  try {
    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", mainAdminEmail)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      console.log("Main Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(mainAdminPassword, 10);

    const { error: createError } = await supabase.from("users").insert({
      name: "Main Admin",
      email: mainAdminEmail,
      password: hashedPassword,
      ward: "All",
      phone: "9999999999",
      role: "admin",
    });

    if (createError) throw createError;

    console.log(`Main Admin created: ${mainAdminEmail} | Password: ${mainAdminPassword}`);
    process.exit(0);
  } catch (error) {
    console.error("Seeding main admin failed:", error.message);
    process.exit(1);
  }
};

seedMainAdmin();
