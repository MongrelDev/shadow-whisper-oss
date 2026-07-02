// Allow importing .sql files as raw strings (for Drizzle migrations)
declare module "*.sql" {
  const content: string;
  export default content;
}
