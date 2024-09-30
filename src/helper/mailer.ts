/**
 * Mailer helper
 * 
 * @since 1.0.0
 * @version 1.0.0
 */

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface iMail {
    to: string;
    from: string;
    subject: string;
    html: string;
}

class Mailer {

    /**
     * email object
     * 
     * @var iMail
     */
    email: iMail


    /**
     * Contructor
     * 
     * @param obj (iMail)
     */
    constructor(obj: iMail) {
        this.email = obj;
    }


    /**
     * Send email
     * 
     * @return boolean
     */
    async send() {
        let emailSent = false;
        await sgMail.send(this.email).then(() => {
            emailSent = true;
            console.log('Email sent')
        })
        .catch((error: any) => {
            console.error(error)
        });

        return emailSent;
    }
}

export default Mailer