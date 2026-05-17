import createUser from "../models/User.js";

//register user
export function registerUser(req, res){
    const data = req.body;
    const hashedPassword = bcrypt.hashSync(data.password, 10);

    const user = createUser({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || "Farmer/PetOwner"
    });

    user.save((err, savedUser) => {
        if(err){
            return res.status(500).json({ message: "Error registering user", error: err });
        }
        res.status(201).json({ message: "User registered successfully", user: savedUser });
    });

}