import "agents";

declare module "agents" {
  export function callable(metadata?: {
    description?: string;
  }): (target: object, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
}
