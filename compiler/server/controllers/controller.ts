import CompilerService from "../services/CompilerService"

const init = async (req, res) => {
  const { key } = req.body;
  try {
    const compiler = CompilerService.init(key);
    res.status(200).json({ message: 'Compiler initialized successfully', compiler });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to initialize compiler', error: error.message });
  }
};

const compile = async (req, res) => {
  const { key, input } = req.body;
  try {
    const output = await CompilerService.compile(key, input);
    res.status(200).json({ message: 'Compilation completed', output });
  } catch (error: any) {
    res.status(500).json({ message: 'Compilation failed', error: error.message });
  }
};

export default {
  init,
  compile,
};