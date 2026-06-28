
use `extends EventTarget` where on* functions are present


### roles

add role hirarchy and role management

RolelManager.addRole("SUPER_ADMIN", true);
RolelManager.addRole("ADMIN", "MOD");
RolelManager.addRole("MOD", "USER");
RolelManager.addRole("USER", "GUEST");
