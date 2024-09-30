/**
 * Middle ware to check whether user is authorized or not
 * 
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {

    // Get the jwt token from the head
    const token = <string>req.headers['authtoken'];
    let jwtPayload: any;

    // Try to validate the token and get data
    try {
        jwtPayload = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
        res.locals.jwtPayload = jwtPayload;
    } catch (error) {
        console.log("Verifing the token has an error: ", error);

        // If user is not authorized yet, return with status 401
        res.status(401).send();

        return;
    }

    // The token is valid for 1 hour
    // We want to send a new token on every request
    const { email, password, role } = jwtPayload;
    const newToken = jwt.sign({ email, password, role }, process.env.JWT_SECRET_KEY as string, {
        expiresIn: "1h"
    });

    res.setHeader("token", newToken);

    //Call the next middleware or controller
    next();
}