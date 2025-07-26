import Yup from 'yup';

export const SignUpSchema = Yup.object().shape({
    name: Yup.string()
        .min(2,"The name should be at least two characters long.")
        .max(25,"The maximun character limit is 25")
        .required("The name is required to be filled!"),
    email: Yup.string()
        .email("Invalid email")
        .required("Email is required"),
    password: Yup.string()
    .min(8, "The length of the password should be 8")
    .max(20, "Only 20 characters are allowed in this field ")
    .required("Password is required!"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], "Password must match")
        .required("Please confirm the password")
});

export const LoginSchema = Yup.object().shape({
    email: Yup.string()
        .email("Invalid email")
        .required("Email is required"),
    password: Yup.string()
    .min(8, "The length of the password should be 8")
    .max(20, "Only 20 characters are allowed in this field ")
    .required("Password is required!"),
});