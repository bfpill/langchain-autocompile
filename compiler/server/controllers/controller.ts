import CompilerService from "../services/CompilerService"


const initializeCompiler = async (req, res) => {
  const { key, language } = req.body;
  try {
    const compilerMessage = CompilerService.initializeCompiler(key, language);
    res.status(200).json({ message: 'Compiler initialized successfully'});
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to initialize compiler', error: error.message });
  }
};

const compile = async (req, res) => {
  const { key, codePath } = req.body;

  try {
    const output = await CompilerService.compile(key, codePath);
    res.status(200).json({ message: 'Compilation completed: ', output });
  } catch (error: any) {
    res.status(500).json({ message: 'Compilation failed', error: error.message });
  }
};

export default {
  initializeCompiler,
  compile,
};
