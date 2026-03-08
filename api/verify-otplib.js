const otplib = require("otplib");

try {
    const secret = otplib.generateSecret();
    console.log("Secret generated successfully:", secret);

    const uri = otplib.generateURI({
        label: "testuser",
        issuer: "TestApp",
        secret: secret
    });
    console.log("URI generated successfully:", uri);

    const token = otplib.generateSync({ secret });
    console.log("Token generated successfully:", token);

    const isValid = otplib.verifySync({
        token,
        secret
    });
    console.log("Token verification successful:", isValid);

    if (isValid) {
        console.log("VERIFICATION PASSED");
    } else {
        console.log("VERIFICATION FAILED: Invalid token");
    }
} catch (error) {
    console.error("VERIFICATION FAILED with error:", error);
    process.exit(1);
}
