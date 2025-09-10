# 死循环问题
1. 现象  
   • 打开 Sidebar 后立刻抛出 “Maximum update depth exceeded” 异常，说明组件在一次更新中又触发了新的 setState ，从而进入死循环。  
   • 堆栈指向 `ResizeHandle-BpBk2L95.js`（打包后的 React 代码），真正的源头在 `<SidebarApp>`。  

2. 成因  
   • `SidebarApp` 在 `useEffect` 依赖数组中直接写入了 **来自 Zustand store 的函数引用**（如 `setCurrentPage`、`clearCurrentPage` 等）。  
   • 当组件渲染时，`useAppStore()` **返回的新对象每次都是全新的引用**（因为 selector 返回的是一个对象字面量），React 认为依赖发生变化 → 重新执行 `useEffect`。  
   • `useEffect` 内部又调用了这些 store 方法（会导致 `SidebarApp` 再次渲染），渲染后依赖再次变化 … 形成无限循环。  

   ! 典型易犯错误  
   1. 在 selector 中直接返回 `{ a: state.a, b: state.b }` 而不做浅比较。  
   2. 将 selector 返回的对象 / 方法直接放进 `useEffect` 依赖数组。  
   3. 忽略了函数在 React 依赖数组中的“不稳定”特性。  

3. 解决方案  
   a. **让 selector 返回稳定引用**  
      • 用 `shallow` 比较：  
        ```ts
        const { a, b } = useStore(s => ({ a: s.a, b: s.b }), shallow)
        ```  
      • 或者拆成多个独立 selector，一次只取一个字段：  
        ```ts
        const a = useStore(s => s.a)
        const b = useStore(s => s.b)
        ```  

   b. **谨慎写依赖数组**  
      • 如果 store 方法本身是固定的（Zustand 默认“函数引用不变”），可以**不把它写进依赖数组**；或者通过 `const fn = useStore(s => s.fn)` 单独拿出，React 就不会因为对象整体变化而判定依赖变动。  

   c. **检查自定义 hook**  
      • 在 `useTabSwitchHandler`、`useContentExtraction` 等 hook 里，同样要保证暴露给外部的回调引用稳定，防止父组件的 `useEffect` 把它们当作依赖导致重复执行。  

4. 最终修改  
   • 把 `useAppStore` 的使用方式从  
     ```ts
     const { … } = useAppStore(state => ({ … }))
     ```  
     改为单字段 selector；  
   • 去掉了对 `zustand/shallow` 未使用的导入及无用变量；  
   • `useEffect` 依赖数组保持空（因内部调用的 store 方法引用稳定）。  

5. 实战经验总结  
   1. **不要在 selector 里直接返回对象字面量**，除非配合 `shallow`。  
   2. **store 方法/对象进依赖数组前先想想**：它是否真的会变？会变就 memo；不会变就不要写。  
   3. 出现 “Maximum update depth exceeded” 时，八成是某个 effect / render 中的 setState 触发了重新渲染，回到第一步排查依赖是否稳定。  
   4. 对于大型组件，推荐：  
      • 状态读取 → “一个字段一个 selector”；  
      • 方法读取 → `const action = useStore(s => s.action)`；  
      • 组合多个字段时加 `shallow`。  

遵循以上原则，可有效避免因依赖不稳定导致的死循环更新。