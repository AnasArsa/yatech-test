import { Response, Request } from "express"
// import type { Request } from "../../types/session"
import { prisma } from "../utils/prisma"
import bcrypt from "bcrypt"
import { generateAccessToken, generateRefreshToken } from '../middleware/jwt'

async function Login (req: Request, res: Response) {
  const { username, password } = req.body.data;
  try {
    // Check if user exists
    const user = await prisma.user.findFirst({ where: { 
      OR: [
        { email: username },
        { username }
      ]}
    });
    
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }
    const tokenData = { id: user.id, email: user.email, role: user.role }
    // Create and sign JWT token
    const accessToken = generateAccessToken(tokenData);
    const refreshToken = generateRefreshToken(tokenData);
    // Set Authorization header
    res.set('Authorization', `Bearer ${accessToken}`);
    res.cookie('access-token', accessToken, { sameSite: 'lax' })

    res.json({
      data: { accessToken, refreshToken, loginOn: Date.now(), user: { id: user?.id, username: user?.username, role: user?.role } }
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

export default Login