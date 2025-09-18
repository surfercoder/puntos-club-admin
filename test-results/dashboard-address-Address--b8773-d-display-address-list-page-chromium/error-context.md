# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]: Login
      - generic [ref=e8]: Enter your email below to login to your account
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]:
          - generic [ref=e13]: Email
          - textbox "Email" [ref=e14]: agustinscassani@gmail.com
        - generic [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e17]: Password
            - link "Forgot your password?" [ref=e18] [cursor=pointer]:
              - /url: /auth/forgot-password
          - textbox "Password" [ref=e19]: Asc171081!
        - paragraph [ref=e20]: Failed to fetch
        - button "Login" [ref=e21]
      - generic [ref=e22]:
        - text: Don't have an account?
        - link "Sign up" [ref=e23] [cursor=pointer]:
          - /url: /auth/sign-up
  - region "Notifications alt+T"
  - generic [ref=e28] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e29] [cursor=pointer]:
      - img [ref=e30] [cursor=pointer]
    - generic [ref=e33] [cursor=pointer]:
      - button "Open issues overlay" [ref=e34] [cursor=pointer]:
        - generic [ref=e35] [cursor=pointer]:
          - generic [ref=e36] [cursor=pointer]: "0"
          - generic [ref=e37] [cursor=pointer]: "1"
        - generic [ref=e38] [cursor=pointer]: Issue
      - button "Collapse issues badge" [ref=e39] [cursor=pointer]:
        - img [ref=e40] [cursor=pointer]
  - alert [ref=e42]
```