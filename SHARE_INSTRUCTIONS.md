# How to Share Your Website

I have successfully updated your project's configuration so that your React Frontend (`client`) and your Node.js Backend (`server`) are seamlessly served from a **single port**. This means you only need to expose your frontend port (`3000`) and the API will automatically work!

### Steps to generate your public link:

1. **Start your Backend Server**
   Open a terminal, `cd server`, and run:
   ```bash
   npm run dev
   ```

2. **Start your Frontend Server**
   Open a *second* terminal, `cd client`, and run:
   ```bash
   npm run dev
   ```

3. **Generate your Public Link**
   Open a *third* terminal (any folder) and run this command:
   ```bash
   npx localtunnel --port 3000 --subdomain homemade-protein
   ```
   > **Note:** If `homemade-protein` is taken by someone else, you can change the subdomain to anything else.
   
4. **Copy the link!**
   The terminal will output a link like: `https://homemade-protein.loca.lt`
   Copy this link and send it to your friends or open it on your phone! Everything, including ordering, sending messages, and real-time backend updates, will work perfectly!

> [!IMPORTANT]
> Because you are using a free tunneling service, you or your friends might see a "Friendly Warning" page the first time you open the link. Just click **"Click to Continue"** to access the website.
