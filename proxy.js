
const express = require('express');
const httpProxy = require('http-proxy');
const cors = require('cors');
const app = express();
const proxy = httpProxy.createProxyServer();
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的 HTTP 方法
  allowedHeaders: ['Content-Type', 'Authorization'] // 允许的请求头
}));

const TARGET_SERVER_URL = 'http://localhost:11434/'; // 替换成目标服务器的 URL

// // 中间件用于解析请求体
// app.use(express.json());


// // 添加截取并打印前端发送的请求体内容
// app.use((req, res, next) => {
//   console.log('请求内容:', req.body); // 打印请求体内容
// });


//监控返回的数据
app.all('*', (req, res) => {
  // 创建一个可写流，用于存储代理服务器返回的数据
  // 存储响应数据的变量
  let responseData = '';
  // 监听代理服务器的响应数据
  //在接收到来自目标服务器的响应后触发此事件。可用于修改响应或检查响应的内容。
  proxy.on('proxyRes', (proxyRes, req, res) => {
    console.log("proxyRes：状态码"+res.statusCode);
    //console.log(req);
    proxyRes.on('data', (chunk) => {
      responseData += chunk;
    });
    proxyRes.on('end', (req, res) => {
      // 响应结束时打印收到的数据
      console.log('proxyRes：发送数据:', responseData);
    });
  });
  // 当代理服务器关闭连接时触发此事件。
  proxy.on('end', (req, res) => {
    // console.log('结束：与目标服务器的连接已关闭');
    // console.log("结束：状态码"+res.statusCode);
    // console.log("结束：返回头");
    // console.log(res.getHeaders());
    // console.log(res);
  });
  //异常信息
  proxy.on('error', (err) => {
    console.error('错误：代理服务器发生错误:', err);
  });

  //当代理套接字与目标服务器建立连接时触发此事件。
  proxy.on('start', (req, res) => {
    //console.log("开始：状态码"+res.statusCode);
    // console.log("开始：返回头");
    // console.log(res.getHeaders());
    // console.log(req);
  });

  

  //在代理请求被发送之前触发此事件。可以用来修改传出的请求，例如添加标头或更改URL。
  proxy.on('proxyReq', (proxyReq, req, res, options) => {
    // console.log("proxyReq：状态码"+res.statusCode);
    // console.log("proxyReq：返回头");
    // console.log(proxyReq);
    //proxyReq.setHeader('X-Special-Header', 'SpecialValue');
    let origin=proxyReq.getHeader("Origin");
    let referer=proxyReq.getHeader("Referer");
    console.log("proxyReq：origin："+origin);
    console.log("proxyReq：referer："+referer);
    // proxyReq.setHeader('Origin', 'http://0.0.0.0'); // 设置新的 Origin
    // proxyReq.setHeader('Referer', 'http://0.0.0.0'); // 设置新的 Referer
    //console.log(req);
  });

  proxy.web(req, res, { target: TARGET_SERVER_URL }, (err, proxyRes) => {
    
    if (err) {
      console.error('Proxy Error:', err);
      res.status(500).send('Proxy Error');
    } else {
      console.log('Proxy Response:', proxyRes.statusCode);
      // 如果目标服务器返回404，则替换为其他状态码
      if (proxyRes.statusCode === 404) {
        res.status(200)
        proxyRes.pipe(res);
      } else {
        res.status(proxyRes.statusCode);
        proxyRes.pipe(res);
        console.log('Response Data:', responseData);
      }
    }
  });
});

const PORT = 3000; // 代理服务器监听的端口
app.listen(PORT, () => {
  console.log(`开始监听端口 ${PORT}`);
});