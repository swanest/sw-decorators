import {expect} from "chai";
import * as _ from "lodash";
import {Logger, CustomError} from 'sw-logger';
import {
    Schema,
    Min,
    Max,
    Contains,
    ValidateNested,
    IsDefined,
    Length,
    ValidateIf,
    IsEmail,
    IsFQDN, Strict, IsDatable, ToDate
} from '../index';


function humanizeValidationErrors(errorsValidation: Array<any>): Object {
    let objError: any = {};

    function recur(vErrors: Array<any>, obj: any, path: string) {
        for (let i = 0; i < vErrors.length; i++) {
            let vErr = vErrors[i];
            if (vErr.children.length) {
                recur(vErr.children, obj, path + vErr.property + '/');
            } else {
                obj[path + vErr.property + '/'] = {value: vErr.value, constraints: vErr.constraints};
            }
        }
    }

    recur(errorsValidation, objError, '/');
    return objError;
}

let tracer = new Logger();

describe("Schemas", () => {

    it("fromSchema() should fail", async function () {
        this.timeout(2000000);
        class User extends Schema {
            @Strict(false)
            @Min(12) @Max(12)
            age: number;
            @Contains("patrick")
            name: string;

            constructor() {
                super("age", "name");
            }
        }
        class Post extends Schema {
            @Strict(true)
            @IsDefined() @ValidateNested()
            user: User;
            @IsDefined() @ValidateNested()
            user2: User;
            @Length(5, 20)
            title: string;
            @Contains("hello") @Length(10, 200)
            text: string;
            // @IsDatable()
            // @ToDate()
            // date: Date;
            @ValidateIf(obj => obj.email != void 0) @IsEmail()
            email: string;
            @IsFQDN()
            site: string;
            @IsDefined() @ValidateNested()
            users: Array<User>;

            @IsDefined() @ValidateNested()
            users2: Array<User>;

            constructor() {
                super({user: User}, {user2: User}, "title", "text", "date", "email", "site", {users: [User]}, {users2: [User]});
            }
        }
        let req = {
            title: "Hello",
            text: "hello this blabla",
            email: "okok@okok.com",
            site: "www.okok.com",
            date: "2015-05-05T44:56:43.854Z",
            moremore: 1,
            user2: 'test',
            user: {
                camembert: 3,
                name: "patric",
                age: 12
            },
            users: [
                {
                    camembert: 3,
                    name: "patrick",
                    age: 13
                }, {
                    camembert: 3,
                    name: "patrick",
                    age: 13
                }],
            users2: {}
        };
        try {
            let b: Post = await Post.fromSchema<Post>(req);
            throw new Error("not expected to pass");
        } catch (e) {
            expect(e.info.validationErrors).to.have.lengthOf(5);
            expect(e.info.validationErrors[3].children).to.have.lengthOf(2);
        }
    });


    it("fromSchema() should pass", async function () {
        this.timeout(2000000);
        class User extends Schema {
            @Strict(false)
            @Min(12) @Max(12)
            age: number;
            @Contains("patrick")
            name: string;

            constructor() {
                super("age", "name");
            }
        }
        class Post extends Schema {
            @Strict(true)
            @IsDefined() @ValidateNested()
            user: User;
            @Length(5, 20)
            title: string;
            @Contains("hello") @Length(10, 200)
            text: string;
            @IsDatable()
            @ToDate()
            date: Date;
            @ValidateIf(obj => obj.email != void 0) @IsEmail()
            email: string;
            @IsFQDN()
            site: string;

            constructor() {
                super({user: User}, "title", "text", "date", "email", "site");
            }
        }
        let req = {
            title: "Hello",
            text: "hello this blabla",
            email: "okok@okok.com",
            site: "www.okok.com",
            date: "2015-05-05T14:56:43.854Z",
            user: {
                camembert: 3,
                name: "patrick",
                age: 12
            }
        };
        let b: Post = await Post.fromSchema<Post>(req);
        expect(b).to.be.instanceof(Post);
    });

    it("fromSchema() with array types should pass", async function () {
        this.timeout(2000000);
        class User extends Schema {
            @Strict(false)
            @Min(12) @Max(15)
            age: number;
            @Contains("patrick")
            name: string;

            constructor() {
                super("age", "name");
            }
        }
        class Post extends Schema {
            @Strict(true)
            @IsDefined() @ValidateNested()
            user: User;
            @Length(5, 20)
            title: string;
            @Contains("hello") @Length(10, 200)
            text: string;
            @IsDatable()
            @ToDate()
            date: Date;
            @ValidateIf(obj => obj.email != void 0) @IsEmail()
            email: string;
            @IsFQDN()
            site: string;
            @IsDefined() @ValidateNested({each: true})
            users: Array<User>;
            @ValidateIf(o => o.users2) @ValidateNested({each: true})
            users2: Array<User>;
            @ValidateIf(o => o.users) @ValidateIf(o => o.users2) @ValidateNested({each: true})
            users3: Array<User>;

            constructor() {
                super({user: User}, "title", "text", "date", "email", "site", {users: [User]}, {users2: [User]}, {users3: [User]});
            }
        }
        let req: any = {
            title: "Hello",
            text: "hello this blabla",
            email: "okok@okok.com",
            site: "www.okok.com",
            date: "2015-05-05T14:56:43.854Z",
            user: {
                camembert: 3,
                name: "patrick",
                age: 12
            },
            users: [
                {
                    camembert: 3,
                    name: "patrick",
                    age: 15
                }, {
                    camembert: 3,
                    name: "patrick",
                    age: 14
                }
            ],
            users2: null,
            users3: null
        };
        let b: Post;
        try {
            b = await Post.fromSchema<Post>(req);
            expect(b).to.be.instanceof(Post);
        } catch (e) {
            tracer.log(e.info.validationErrors);
        }
    });

    it("toSchema() should fail", async function () {
        this.timeout(2000000);
        class User extends Schema {
            @Strict(false)
            @Min(12) @Max(14)
            age: number;
            @Contains("patrick")
            name: string;

            extra: Date;

            constructor() {
                super("age", "name");
            }
        }
        class Post extends Schema {
            @Strict(true)
            @IsDefined() @ValidateNested()
            user: User;
            @Length(5, 20)
            title: string;
            @Contains("hello") @Length(10, 200)
            text: string;
            @IsDatable()
            @ToDate()
            date: Date;
            @ValidateIf(obj => obj.email != void 0) @IsEmail()
            email: string;
            @IsFQDN()
            site: string;
            @IsDefined() @ValidateNested({each: true})
            users: Array<User>;
            @ValidateIf(o => o.users != void 0) @ValidateNested({each: true})
            users2: Array<User>;

            constructor() {
                super({user: User}, "title", "text", "date", "email", "site", {users: [User]}, {users2: [User]});
            }
        }
        let req: any = {
            title: "Hello",
            text: "hello this blabla",
            email: "okok@okok.com",
            site: "www.okok.com",
            date: "2015-05-05T14:56:43.854Z",
            user: {
                camembert: 3,
                name: "patrick",
                age: 12
            },
            users: [
                {
                    camembert: 3,
                    name: "patrick",
                    age: 13
                }, {
                    camembert: 3,
                    name: "patrick",
                    age: 14
                }],
            users2: null
        };
        try {
            let b: Post = await Post.fromSchema<Post>(req);
            throw new Error("not expected to pass");
        } catch (e) {
            expect(e.info.validationErrors).to.have.lengthOf(1);
            expect(e.info.validationErrors[0].children).to.have.lengthOf(1);
        }
    });


    it("toSchema() should pass", async function () {
        this.timeout(2000000);
        class User extends Schema {
            @Strict(false)
            @Min(12) @Max(14)
            age: number;
            @Contains("patrick")
            name: string;

            extra: Date;

            constructor() {
                super("age", "name");
            }
        }
        class Post extends Schema {
            @Strict(true)
            @IsDefined() @ValidateNested()
            user: User;
            @Length(5, 20)
            title: string;
            @Contains("hello") @Length(10, 200)
            text: string;
            @IsDatable()
            @ToDate()
            date: Date;
            @ValidateIf(obj => obj.email != void 0) @IsEmail()
            email: string;
            @IsFQDN()
            site: string;
            @IsDefined() @ValidateNested({each: true})
            users: Array<User>;
            @ValidateIf(o => o.users2 != void 0) @ValidateNested({each: true})
            users2: Array<User>;

            constructor() {
                super({user: User}, "title", "text", "date", "email", "site", {users: [User]}, {users2: [User]});
            }
        }
        let req: any = {
            title: "Hello",
            text: "hello this blabla",
            email: "okok@okok.com",
            site: "www.okok.com",
            date: "2015-05-05T14:56:43.854Z",
            user: {
                camembert: 3,
                name: "patrick",
                age: 12
            },
            users: [
                {
                    camembert: 3,
                    name: "patrick",
                    age: 13
                }, {
                    camembert: 3,
                    name: "patrick",
                    age: 14
                }],
            users2: null
        };
        let b: Post = await Post.fromSchema<Post>(req);
        b.user.extra = new Date();
        delete req.user.camembert;
        expect(JSON.parse(JSON.stringify(b))).to.have.all.keys(_.keys(req));
        expect(JSON.parse(JSON.stringify(b)).users).to.be.instanceOf(Array);
    });


});