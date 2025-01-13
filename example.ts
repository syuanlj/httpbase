import { AxiosResponse } from "axios";
import { HttpBase } from ".";
class MyHttp extends HttpBase {
    private static instance: MyHttp;

    // 私有构造函数防止外部使用 new 创建实例
    private constructor() {
        // 初始化代码...
        super('http://www.baidu.com');
    }

    // 静态方法，用于提供全局访问点
    public static getInstance(): MyHttp {
        if (!MyHttp.instance) {
            MyHttp.instance = new MyHttp();
        }
        return MyHttp.instance;
    }


    login(name: string, password: string): Promise<any> {
        return this.post('/login', { name, password })
    }

    getData(params: any): Promise<AxiosResponse<any, any>> {
        return this.get('/getdata', params)
    }

    getSerial() {
        return this.requestSerial([
            {
                url: '/getdata',
                method: 'get',
                params: {
                    name: 'zhangsan'
                }
            },
            {
                url: '/getdata',
                method: 'get',
                params: {
                    name: 'lisi'
                }
            }
        ])
    }

    postParallel() {
        return this.requestParallel([
            {
                url: '/getdata',
                method: 'post',
                data: {
                    name: 'zhangsan'
                }
            },
            {
                url: '/getdata',
                method: 'post',
                data: {
                    name: 'lisi'
                }
            }
        ])
    }
}