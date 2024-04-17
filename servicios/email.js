import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function enviarMailVerificacion(direccion, token) {
  try {
    await transporter.sendMail({
      from: "PuntoJson 👻 <no-reply@puntojson.com>",
      to: direccion,
      subject: "Verificación de nueva cuenta - puntoJson",
      html: `
        <p>Hola,</p>
        <p>Para verificar tu cuenta en puntoJson, haz clic en el siguiente enlace:</p>
        <p><a href="http://localhost:4000/verificar/${token}">Verificar cuenta</a></p>
        <p>Si no te has registrado en puntoJson, puedes ignorar este correo electrónico.</p>
        <p>Saludos,</p>
        <p>Equipo de puntoJson</p>
      `
    });
    return { success: true };
  } catch (error) {
    console.error("Error enviando correo de verificación:", error);
    return { success: false, error: "Error enviando correo de verificación" };
  }
}
