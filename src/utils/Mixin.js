class MixinBuilder {

    constructor(superclass) {
        this.superclass = superclass;
    }

    with(...mixins) {
        return mixins.reduce((c, mixin) => mixin(c), this.superclass);
    }

}

export function mix(superclass) {
    return new MixinBuilder(superclass);
}

export function createMixin(mixin) {
    const typeTag = Symbol("isa");
    const _mixin = (target = Object) => {
        const ext = mixin(target);
        Object.defineProperty(ext.prototype, typeTag, {value: true});
        return ext;
    };
    Object.defineProperty(_mixin, Symbol.hasInstance, {value: (i) => !!i[typeTag]});
    return _mixin;
}

export default {
    mix,
    createMixin
};
